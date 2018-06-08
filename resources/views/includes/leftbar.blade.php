<script type="text/javascript">
    $(document).ready(function() {
    // get current URL path and assign 'active' class
    var pathname = window.location.pathname;
    $('li > a[href="'+pathname+'"]').parents('ul').addClass('in');
    $('li > a[href="'+pathname+'"]').parents('ul').siblings().addClass('in');
})
</script>

            <div class='navigation'>
                <ul class='nav nav-stacked'>
                     @foreach($parentRows as $parent)
                        <li class="">
                            <a class="dropdown-collapse" href='#'>
                            <i class='{{$parent->icon}}'></i>
                                <span>{{$parent->label}}</span>
                            <i class='icon-angle-down angle-down'></i>    
                            </a>
                            @foreach ($rows as $row)
                                @if($row->parent_id == $parent->id)
                                    <ul class="nav nav-stacked">
                                        <li>
                                            <a class="{{ $row->url == '#' ? 'dropdown-collapse' : ''  }}" href="/person{{$row->url}}">
                                                <i class='icon-caret-right'></i><span>{{$row->label}}</span>
                                            @if ($row->url == '#')    
                                                <i class='icon-angle-down angle-down'></i>
                                            @endif    
                                            </a>
                                            <?php sub($rows, $row->id)?>
                                        </li>
                                    </ul>
                                @endif
                            @endforeach 
                        </li>
                    @endforeach    
                 </ul>
            </div>

            <?php 

function sub($rows, $id){

    echo "<ul class='nav nav-stacked'>";
    foreach($rows as $row){
        if($row->parent_id == $id){
            echo "<li>";
            if ($row->url == '#') {
                echo "<a class='dropdown-collapse' href='#'>";
            }else {
                echo "<a href='/person" . $row->url . "'>";
            }
            echo "<i class='icon-caret-right'></i><span>".$row->label.'</span>';
            if($row->url == '#') {
                echo "<i class='icon-angle-down angle-down'></i>";
            }
            echo "</a>";
            sub($rows, $row->id);
            echo "</li>";
        }
    }
  echo "</ul>";
}

?>